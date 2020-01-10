export function localStorageAvailable(): boolean{ 
    var test = 'test';
    try {
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch(e) {
      return false;
    }
}

export function emptyDiv(div:HTMLElement):void {
  if(div) {
      while (div.firstChild) {
          div.removeChild(div.firstChild);
      }
  }
}

export function findAncestor (el:HTMLElement, cls:string):HTMLElement {
  if(el.classList.contains(cls)) {
      return el;
  }

  while ((el = el.parentElement) && !el.classList.contains(cls));
  return el;
}