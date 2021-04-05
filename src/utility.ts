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
  return classNames
    .split(separator)
    .filter((c) => c !== className)
    .join(separator);
}

export function get(url: string): Promise<Document> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'document';
    xhr.onload = () => { resolve(xhr.response); };
    xhr.onerror = () => { reject(xhr.status); };

    xhr.send();
  });
}

export function isWithinParentViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const parentRect = element.parentElement.getBoundingClientRect();
  return (
    rect.top >= parentRect.top && rect.bottom <= parentRect.bottom
  );
}
