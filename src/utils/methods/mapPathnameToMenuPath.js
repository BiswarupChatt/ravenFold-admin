// utils/findMenuPathByPathname.js
export function findMenuPathByPathname(menuItems, pathname, path = []) {
  for (const item of menuItems) {
    const newPath = [...path, item.name];

    if (item.path === pathname) {
      return newPath;
    }

    if (item.children) {
      const result = findMenuPathByPathname(item.children, pathname, newPath);
      if (result) return result;
    }
  }

  return null;
}
