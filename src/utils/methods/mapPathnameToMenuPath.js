// utils/findMenuPathByPathname.js
export function findMenuPathByPathname(menuItems, pathname, path = []) {
  for (const item of menuItems) {
    const newPath = [...path, item.name];

    if (item.path === pathname || (item.path && pathname.startsWith(`${item.path}/`))) {
      return newPath;
    }

    if (item.children) {
      const result = findMenuPathByPathname(item.children, pathname, newPath);
      if (result) return result;
    }
  }

  return null;
}
