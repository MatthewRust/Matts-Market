const Layout = ({ children }) => {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div>{children}</div>
    </div>
  );
};

export default Layout;
