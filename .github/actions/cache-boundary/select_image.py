"""Select only image metadata or a source member; never extract an image to disk."""
import base64
import hashlib
import io
import json
import os
import posixpath
import shlex
import sys
import tarfile
import urllib.request

META_LIMIT = 262144
SOURCE_LIMIT = 32768


class LimitedReader:
    def __init__(self, stream, limit):
        self.stream, self.limit, self.count = stream, limit, 0

    def read(self, size=-1):
        if size < 0:
            size = min(1048576, self.limit - self.count + 1)
        data = self.stream.read(min(size, self.limit - self.count + 1))
        self.count += len(data)
        if self.count > self.limit:
            raise ValueError('network_limit')
        return data


def norm(name):
    return posixpath.normpath(name.lstrip('/'))


def docker_entries(url, network_limit, visitor):
    request = urllib.request.Request(url, headers={'Accept-Encoding':'identity'})
    with urllib.request.urlopen(request, timeout=60) as response:
        if response.status != 200:
            raise ValueError('archive_http_status')
        limited = LimitedReader(response, network_limit)
        with tarfile.open(fileobj=limited, mode='r|*') as outer:
            for member in outer:
                if member.isfile() and posixpath.basename(member.name) == 'content-api-image.tar':
                    with tarfile.open(fileobj=outer.extractfile(member), mode='r|*') as image:
                        result = visitor(image)
                    return result, limited.count, member.size
        raise ValueError('expected_archive_member_missing')


def exact_member(url, network_limit, wanted, limit):
    def visit(image):
        for member in image:
            if norm(member.name) == norm(wanted):
                if not member.isfile() or member.size > limit:
                    raise ValueError('metadata_member_size')
                data = image.extractfile(member).read(limit + 1)
                if len(data) != member.size:
                    raise ValueError('metadata_member_truncated')
                return data
        raise ValueError('metadata_member_missing')
    return docker_entries(url, network_limit, visit)


def source_candidates(config):
    runtime = config.get('config') or {}
    workdir = runtime.get('WorkingDir') or '/'
    result = []
    for value in (runtime.get('Entrypoint') or []) + (runtime.get('Cmd') or []):
        if not isinstance(value, str):
            continue
        try:
            tokens = shlex.split(value)
        except ValueError:
            tokens = [value]
        for token in tokens:
            if token.endswith(('.js','.mjs','.cjs','.ts','.tsx')) and not token.startswith('-'):
                candidate = norm(token if token.startswith('/') else posixpath.join(workdir, token))
                if '..' not in candidate.split('/') and candidate not in result:
                    result.append(candidate)
    return result[:3]


def select_source(url, network_limit, layers, candidates):
    ranks = {norm(name):index for index,name in enumerate(layers)}
    found = {}

    def visit(image):
        for member in image:
            layer_name = norm(member.name)
            if layer_name not in ranks or not member.isfile():
                continue
            rank = ranks[layer_name]
            with tarfile.open(fileobj=image.extractfile(member), mode='r|*') as layer:
                for entry in layer:
                    entry_name = norm(entry.name)
                    for candidate in candidates:
                        old = found.get(candidate)
                        if old and old['layer_index'] > rank:
                            continue
                        dirname, basename = posixpath.split(candidate)
                        whiteout = posixpath.join(dirname, '.wh.'+basename)
                        opaque = entry_name == '.wh..wh..opq' or (entry_name.endswith('/.wh..wh..opq') and candidate.startswith(entry_name[:-len('.wh..wh..opq')]))
                        if entry_name == whiteout or opaque:
                            found[candidate] = {'layer_index':rank,'deleted':True}
                        elif entry_name == candidate and entry.isfile():
                            data = layer.extractfile(entry).read(min(entry.size, SOURCE_LIMIT))
                            found[candidate] = {'layer_index':rank,'layer_member':layer_name,'path':candidate,'member_size':entry.size,'retained_bytes':len(data),'complete_member':entry.size <= SOURCE_LIMIT,'prefix_sha256':hashlib.sha256(data).hexdigest(),'bytes_base64':base64.b64encode(data).decode(),'deleted':False}
        for candidate in candidates:
            value = found.get(candidate)
            if value and not value.get('deleted'):
                value.pop('deleted',None)
                return value
        return None

    return docker_entries(url, network_limit, visit)


def main():
    params = json.load(sys.stdin)
    url = params['signed_url']
    if not url.startswith('https://'):
        raise ValueError('https_required')
    maximum = min(int(params['max_network_bytes']),1000000000)
    manifest_bytes, read_manifest, archive_size = exact_member(url, maximum, 'manifest.json', META_LIMIT)
    manifests = json.loads(manifest_bytes)
    if not isinstance(manifests,list) or len(manifests) != 1:
        raise ValueError('unexpected_image_count')
    manifest = manifests[0]
    config_bytes, read_config, _ = exact_member(url, maximum, manifest['Config'], META_LIMIT)
    config = json.loads(config_bytes)
    runtime = config.get('config') or {}
    receipt = {
        'mode':params['mode'],'completed':True,'archive_member':'content-api-image.tar','archive_member_size':archive_size,
        'manifest':manifest,'manifest_sha256':hashlib.sha256(manifest_bytes).hexdigest(),
        'config':{'member':manifest['Config'],'sha256':hashlib.sha256(config_bytes).hexdigest(),'size':len(config_bytes),'architecture':config.get('architecture'),'os':config.get('os'),'working_dir':runtime.get('WorkingDir'),'entrypoint':runtime.get('Entrypoint'),'cmd':runtime.get('Cmd'),'environment_names':[x.split('=',1)[0] for x in runtime.get('Env',[])],'label_names':sorted((runtime.get('Labels') or {}).keys()),'rootfs_diff_ids':(config.get('rootfs') or {}).get('diff_ids',[])},
        'network_bytes_by_pass':[read_manifest,read_config]
    }
    if params['mode'] == 'source_from_command':
        candidates = source_candidates(config)
        receipt['source_candidate_count'] = len(candidates)
        if candidates:
            selected, read_source, _ = select_source(url,maximum,manifest.get('Layers') or [],candidates)
            receipt['source'] = selected
            receipt['network_bytes_by_pass'].append(read_source)
        else:
            receipt['source'] = None
        # A Node image may invoke a package manager rather than name its entry
        # source directly. Read only its configured working-directory package
        # metadata, then select the explicit main/module source path.
        workdir = runtime.get('WorkingDir')
        if receipt['source'] is None and isinstance(workdir,str) and workdir:
            package_path = norm(posixpath.join(workdir,'package.json'))
            package, read_package, _ = select_source(url,maximum,manifest.get('Layers') or [],[package_path])
            receipt['network_bytes_by_pass'].append(read_package)
            if package and package['complete_member']:
                package_json = json.loads(base64.b64decode(package['bytes_base64']))
                package_candidates = []
                for value in [package_json.get('main'),package_json.get('module')]:
                    if isinstance(value,str) and value.endswith(('.js','.mjs','.cjs','.ts','.tsx')):
                        candidate = norm(posixpath.join(workdir,value))
                        if candidate.startswith(norm(workdir).rstrip('/')+'/') and candidate not in package_candidates:
                            package_candidates.append(candidate)
                receipt['package_metadata'] = {'path':package_path,'sha256':package['prefix_sha256'],'size':package['member_size'],'entry_candidate_count':len(package_candidates)}
                if package_candidates:
                    selected, read_source, _ = select_source(url,maximum,manifest.get('Layers') or [],package_candidates[:2])
                    receipt['source'] = selected
                    receipt['network_bytes_by_pass'].append(read_source)
    print(json.dumps(receipt,separators=(',',':')))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        # Exceptions may contain a signed URL or image data. Never emit them.
        sys.exit(2)
