import TopBar from "./TopBar";

const Header = () => {
  return (
    <header
      className="
        sticky top-0 z-50 w-full
        rounded-b-3xl sm:rounded-b-[36px] md:rounded-b-[48px]
        border-b border-white/10
        bg-gradient-to-br from-black via-zinc-900 to-black
        shadow-xl shadow-black/30
        backdrop-blur-xl
      "
    >
      <TopBar />
    </header>
  );
};

export default Header;
