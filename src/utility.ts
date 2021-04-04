export function toggleClass(node: HTMLElement, className: string, force?: boolean) {
  const exists = node.className.indexOf(className) >= 0;
  const shouldExist = force == null ? !exists : force;

  if ((exists && shouldExist) || (!exists && !shouldExist)) {
    return;
  }

  if (shouldExist) {
    node.className += ` ${className}`;
  } else {
    node.className = stringFilter(node.className, className, ' ');
  }
}

export function stringFilter(classNames: string, className: string, separator: string): string {
  return className
    .split(separator)
    .filter((c) => c !== className)
    .join(separator);
}

export function get(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = () => { resolve(xhr.responseText); };
    xhr.onerror = () => { reject(xhr.status); };
  });
}
