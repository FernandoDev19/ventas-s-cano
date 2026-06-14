export default function Header() {
    return (
        <div className="bg-[#181818] border border-t-gold/30 border-l-gold/30 border-r-gold/30 shadow-md sticky top-0 z-50 rounded-t-xl">
            <div className="py-5 px-5 flex-row justify-between items-center">
                <img className="w-auto h-14" src="/logo.png" alt="Logo Sabor Espress" />
            </div>
        </div>
    );
}