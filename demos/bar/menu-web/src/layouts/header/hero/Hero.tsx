const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1600&q=80",
    title: "Coctelería de Autor",
    subtitle:
      "Sabores exclusivos y mezclas perfectas creadas por nuestros expertos mixólogos.",
  },
  {
    src: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=80",
    title: "Sabores para Compartir",
    subtitle:
      "La compañía ideal para tus copas con platillos diseñados para disfrutar en mesa.",
  },
  {
    src: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80",
    title: "Experiencias Únicas",
    subtitle:
      "El encuentro perfecto entre buena música, luces tenues y la mejor atmósfera.",
  },
];

type HeroProps = {
  activeIndex: number;
};

export default function Hero({ activeIndex }: HeroProps) {
  return (
    <section className="w-full min-h-[500px] h-[100vh] absolute top-0 left-0 overflow-hidden bg-black">
      {SLIDES.map((slide, index) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out flex flex-col justify-center items-center text-center px-8 md:px-24 ${
            index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          {/* Imagen de fondo */}
          <img
            src={slide.src}
            alt={slide.title}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />

          {/* Capa de oscurecimiento */}
          <div className="absolute inset-0 bg-black/55" />

          {/* Contenido de texto en el centro */}
          <div className="relative z-10 max-w-2xl mt-12">
            <h2 className="text-3xl md:text-6xl font-bold text-gold font-playfair mb-4 leading-tight tracking-wide">
              {slide.title}
            </h2>
            <p className="text-xs md:text-lg text-cream/80 font-inter max-w-lg mx-auto leading-relaxed">
              {slide.subtitle}
            </p>
          </div>
        </div>
      ))}
      {/* Capa de textura de grano de foto vieja */}
      <div className="absolute inset-0 bg-grain opacity-[0.08] pointer-events-none mix-blend-overlay z-20" />
    </section>
  );
}
