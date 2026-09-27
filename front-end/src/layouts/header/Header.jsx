import TopBar from "./TopBar";

const Header = () => {
  return (
    <header
      className="
        sticky
        top-0
        z-50
        w-full
        rounded-b-[70px]
        bg-gradient-to-br
        from-black
        via-zinc-900
        to-black
        shadow-2xl
        shadow-black
        sm:rounded-b-[110px]
        md:rounded-b-[150px]
        lg:rounded-b-[200px]"
    >
      <TopBar />
    </header>
  );
};

export default Header;
