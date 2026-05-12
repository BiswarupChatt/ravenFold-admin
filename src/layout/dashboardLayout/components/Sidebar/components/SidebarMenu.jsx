import SidebarItem from "./SidebarItem";
import Box from "@mui/material/Box";

const SidebarMenu = ({ item, isOpen, activePath, setActivePath, currentPath }) => {
  const hasChildren = item.children && item.children.length > 0;

  const isExpanded =
    activePath.length >= currentPath.length &&
    currentPath.every((name, index) => activePath[index] === name);

  const handleClick = () => {
    const isSamePath =
      activePath.length === currentPath.length &&
      activePath.every((v, i) => currentPath[i] === v);

    if (isSamePath) {
      setActivePath(currentPath.slice(0, -1)); // collapse
    } else {
      setActivePath(currentPath); // open or activate
    }
  };

  return (
    <Box component="li" sx={{ listStyle: "none" }}>
      <SidebarItem
        item={item}
        isOpen={isOpen}
        expanded={isExpanded}
        onToggle={handleClick}
      />

      {hasChildren && isExpanded && (
        <Box
          component="ul"
          sx={{
            listStyle: "none",
            m: 0,
            ml: isOpen ? 2 : 0,
          }}
        >
          {item.children.map((child) => (
            <SidebarMenu
              key={child.name}
              item={child}
              isOpen={isOpen}
              activePath={activePath}
              setActivePath={setActivePath}
              currentPath={[...currentPath, child.name]}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SidebarMenu;
