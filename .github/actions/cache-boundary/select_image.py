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


class NetworkBudget:
    def __init__(self, per_pass, total):
        self.per_pass, self.total, self.count, self.passes = per_pass, total, 0, []

    @property
    def remaining(self):
        return self.total - self.count

    def charge(self, amount):
        self.count += amount
        if self.count > self.total:
            raise ValueError('network_total_limit')


class LimitedReader:
    def __init__(self, stream, budget):
        self.stream, self.budget = stream, budget
        self.limit, self.count = min(budget.per_pass,budget.remaining), 0

    def read(self, size=-1):
        remaining = min(self.limit-self.count,self.budget.remaining)
        if size == 0:
            return b''
        if remaining <= 0:
            raise ValueError('network_limit')
        if size < 0:
            size = min(1048576,remaining)
        data = self.stream.read(min(size,remaining))
        self.count += len(data)
        self.budget.charge(len(data))
        if self.count > self.limit:
            raise ValueError('network_limit')
        return data


def norm(name):
    return posixpath.normpath(name.lstrip('/'))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError('archive_redirect')


def open_archive(request):
    return urllib.request.build_opener(NoRedirect).open(request,timeout=60)


def docker_entries(url, budget, visitor):
    request = urllib.request.Request(url, headers={'Accept-Encoding':'identity'})
    with open_archive(request) as response:
        if response.status != 200:
            raise ValueError('archive_http_status')
        limited = LimitedReader(response, budget)
        try:
            with tarfile.open(fileobj=limited, mode='r|*') as outer:
                for member in outer:
                    if member.isfile() and posixpath.basename(member.name) == 'content-api-image.tar':
                        with tarfile.open(fileobj=outer.extractfile(member), mode='r|*') as image:
                            result = visitor(image)
                        return result, limited.count, member.size
            raise ValueError('expected_archive_member_missing')
        finally:
            budget.passes.append(limited.count)


def exact_member(url, budget, wanted, limit):
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
    return docker_entries(url, budget, visit)


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
    return result[:1]


def select_source(url, budget, layers, candidates):
    if len(candidates) != 1:
        raise ValueError('one_source_path_required')
    candidate = candidates[0]
    ranks = {norm(name):index for index,name in enumerate(layers)}
    found = None

    def locate(image):
        nonlocal found
        for member in image:
            layer_name = norm(member.name)
            if layer_name not in ranks or not member.isfile():
                continue
            rank = ranks[layer_name]
            if found and found['layer_index'] > rank:
                continue
            replacement = None
            lower_hidden = False
            with tarfile.open(fileobj=image.extractfile(member), mode='r|*') as layer:
                for entry in layer:
                    entry_name = norm(entry.name)
                    dirname, basename = posixpath.split(entry_name)
                    if basename == '.wh..wh..opq':
                        if not dirname or candidate.startswith(dirname.rstrip('/')+'/'):
                            lower_hidden = True
                    elif basename.startswith('.wh.'):
                        removed = posixpath.join(dirname,basename[4:])
                        if candidate == removed or candidate.startswith(removed.rstrip('/')+'/'):
                            lower_hidden = True
                    elif entry_name == candidate:
                        replacement = {'layer_index':rank,'layer_member':layer_name,'path':candidate,'member_size':entry.size,'header_offset':entry.offset,'deleted':not entry.isfile()}
                    elif entry_name not in ('','.') and candidate.startswith(entry_name.rstrip('/')+'/') and not entry.isdir():
                        replacement = {'layer_index':rank,'deleted':True}
                        lower_hidden = True
            if replacement is not None:
                found = replacement
            elif lower_hidden:
                found = {'layer_index':rank,'deleted':True}
        return found if found and not found.get('deleted') else None

    selected, read_locate, archive_size = docker_entries(url,budget,locate)
    if selected is None:
        return None,read_locate,archive_size

    def read_selected(image):
        for member in image:
            if norm(member.name) != selected['layer_member'] or not member.isfile():
                continue
            with tarfile.open(fileobj=image.extractfile(member),mode='r|*') as layer:
                for entry in layer:
                    if entry.offset == selected['header_offset'] and norm(entry.name) == candidate and entry.isfile():
                        data = layer.extractfile(entry).read(min(entry.size,SOURCE_LIMIT))
                        return {k:v for k,v in selected.items() if k not in ('deleted','header_offset')} | {'retained_bytes':len(data),'complete_member':entry.size <= SOURCE_LIMIT,'prefix_sha256':hashlib.sha256(data).hexdigest(),'bytes_base64':base64.b64encode(data).decode()}
        raise ValueError('selected_source_missing')

    result,read_source,_ = docker_entries(url,budget,read_selected)
    return result,read_locate+read_source,archive_size


def main():
    params = json.load(sys.stdin)
    url = params['signed_url']
    if not url.startswith('https://'):
        raise ValueError('https_required')
    maximum = min(int(params['max_network_bytes']),1000000000)
    budget = NetworkBudget(maximum,min(int(params.get('max_total_network_bytes',3000000000)),3000000000))
    manifest_bytes, read_manifest, archive_size = exact_member(url, budget, 'manifest.json', META_LIMIT)
    manifests = json.loads(manifest_bytes)
    if not isinstance(manifests,list) or len(manifests) != 1:
        raise ValueError('unexpected_image_count')
    manifest = manifests[0]
    config_bytes, read_config, _ = exact_member(url, budget, manifest['Config'], META_LIMIT)
    config = json.loads(config_bytes)
    runtime = config.get('config') or {}
    receipt = {
        'mode':params['mode'],'completed':True,'archive_member':'content-api-image.tar','archive_member_size':archive_size,
        'manifest':manifest,'manifest_sha256':hashlib.sha256(manifest_bytes).hexdigest(),
        'config':{'member':manifest['Config'],'sha256':hashlib.sha256(config_bytes).hexdigest(),'size':len(config_bytes),'architecture':config.get('architecture'),'os':config.get('os'),'working_dir':runtime.get('WorkingDir'),'entrypoint':runtime.get('Entrypoint'),'cmd':runtime.get('Cmd'),'environment_names':[x.split('=',1)[0] for x in runtime.get('Env',[])],'label_names':sorted((runtime.get('Labels') or {}).keys()),'rootfs_diff_ids':(config.get('rootfs') or {}).get('diff_ids',[])},
        'network_limit_bytes':budget.total
    }
    if params['mode'] == 'source_from_command':
        candidates = source_candidates(config)
        receipt['source_candidate_count'] = len(candidates)
        if candidates:
            selected, read_source, _ = select_source(url,budget,manifest.get('Layers') or [],candidates)
            receipt['source'] = selected
        else:
            receipt['source'] = None
    receipt['network_bytes_by_pass'] = budget.passes
    receipt['network_bytes_total'] = budget.count
    print(json.dumps(receipt,separators=(',',':')))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        # Exceptions may contain a signed URL or image data. Never emit them.
        sys.exit(2)
