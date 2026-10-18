import { Link } from "react-router-dom";
import { LinkIcon } from "@heroicons/react/24/solid";
import SectionBackground from "../../ui/SectionBackground";

const OFFERS = [
  {
    title: "Bebidas originales",
    text: "Descubre sabores únicos creados con los mejores ingredientes y nuestra pasión por la mixología.",
    img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1000&auto=format&fit=crop",
    to: "/menu?cat=cocteleria",
  },
  {
    title: "Deliciosos platillos",
    text: "Saborea una selección de platillos elaborados con ingredientes frescos y locales, perfectos para acompañar tus bebidas.",
    img: "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=1000&auto=format&fit=crop",
    to: "/menu?cat=snacks",
  },
  {
    title: "Ambiente acogedor",
    text: "Disfruta de un ambiente cálido y sofisticado, perfecto para relajarte y compartir momentos especiales.",
    img: "https://images.unsplash.com/photo-1624583338957-4d155ca886dc?q=80&w=1000&auto=format&fit=crop",
    to: "/about-us",
  },
];

export default function WhatWeOffer() {
  return (
    <section className="relative isolate w-full px-6 md:px-30 py-16 md:py-24 flex flex-col items-center gap-4">
      <SectionBackground
        src="https://images.unsplash.com/photo-1437418747212-8d9709afab22?q=80&w=900&auto=format&fit=crop"
        brightness={0.3}
      />

      <div className="flex flex-col items-center mb-8 md:mb-12 text-center">
        <p className="uppercase font-extrabold text-gold text-lg">Siempre lo mejor</p>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white uppercase">Qué ofrecemos</h1>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {OFFERS.map((offer) => (
          <div key={offer.title} className="bg-background flex flex-col">
            <Link to={offer.to} className="relative block h-64 md:h-80 overflow-hidden group">
              <div className="z-10 hidden group-hover:flex absolute inset-0 bg-black/60 items-center justify-center">
                <LinkIcon className="w-10 h-10 text-white" />
              </div>
              <img src={offer.img} alt={offer.title} className="w-full h-full object-cover" />
            </Link>
            <div className="flex-1 bg-gold p-6">
              <div className="h-full border-8 border-white p-4 flex flex-col gap-4 items-center">
                <h2 className="uppercase text-2xl md:text-3xl font-extrabold text-white text-center">
                  {offer.title}
                </h2>
                <p className="text-center text-white font-extralight text-sm">{offer.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
