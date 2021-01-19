export default (url: string): string => (url === '' ? `${window.location.protocol}//${window.location.host}` : url);
