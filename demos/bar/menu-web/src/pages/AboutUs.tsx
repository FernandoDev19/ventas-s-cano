import { Link } from "react-router-dom";
import { BAR, SCHEDULE, whatsappLink } from "../config/bar";
import Button from "../components/ui/Button";
import { buttonClasses } from "../components/ui/buttonClasses";

export default function AboutUsPage() {
  return (
    <div className="w-full min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1497644083593-3d059c104422?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')",
            filter: "brightness(0.4) contrast(1.2)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-background/60 to-background z-0" />
        <div className="absolute inset-0 bg-grain opacity-[0.5] mix-blend-overlay z-0" />
        
        <div className="relative z-10 text-center px-6">
          <p className="text-gold font-bold tracking-[0.3em] uppercase text-sm mb-4">
            Conócenos
          </p>
          <h1 className="font-playfair text-6xl md:text-8xl text-white font-extrabold mb-6 leading-none">
            Nuestra Historia
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <div className="absolute -inset-4 border border-gold/30 rounded-t-[100px] rounded-b-xl z-0" />
          <img 
            src="https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
            alt="Interior del bar"
            className="relative z-10 w-full h-auto object-cover rounded-t-[80px] rounded-b-lg shadow-2xl"
          />
        </div>
        
        <div className="flex flex-col justify-center">
          <h2 className="text-4xl md:text-5xl text-gold font-playfair font-bold mb-8 leading-tight">
            Más que un bar, un lugar de encuentro.
          </h2>
          <div className="text-charcoal/80 space-y-6 text-lg font-light leading-relaxed">
            <p>
              {BAR.name} nació de la pasión por crear momentos memorables. Desde nuestros inicios, nos hemos dedicado a perfeccionar el arte de la mixología y la gastronomía para ofrecer una experiencia que despierte todos los sentidos.
            </p>
            <p>
              Cada detalle, desde la selección de nuestros ingredientes hasta la iluminación de nuestros espacios, ha sido cuidadosamente pensado para crear una atmósfera cálida, exclusiva y acogedora.
            </p>
            <p>
              Creemos en la magia de las buenas conversaciones, en el poder de un cóctel perfectamente equilibrado y en la importancia de brindar un servicio excepcional que te haga sentir en casa desde el primer momento.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="bg-[#181818] py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.2] mix-blend-overlay z-0" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl text-white font-playfair font-bold">
              Nuestra Filosofía
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full border border-gold/30 flex items-center justify-center mb-6">
                <span className="text-3xl">🍸</span>
              </div>
              <h3 className="text-gold font-bold text-xl mb-4 tracking-wider uppercase">Calidad</h3>
              <p className="text-white/70 font-light leading-relaxed">
                Utilizamos solo los mejores ingredientes y licores premium para garantizar que cada trago sea una obra maestra.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full border border-gold/30 flex items-center justify-center mb-6">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-gold font-bold text-xl mb-4 tracking-wider uppercase">Ambiente</h3>
              <p className="text-white/70 font-light leading-relaxed">
                Diseñamos espacios que inspiran relajación, lujo sutil y la atmósfera perfecta para desconectar.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full border border-gold/30 flex items-center justify-center mb-6">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-gold font-bold text-xl mb-4 tracking-wider uppercase">Hospitalidad</h3>
              <p className="text-white/70 font-light leading-relaxed">
                El trato cercano y detallista de nuestro equipo es el ingrediente secreto de nuestra casa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visítanos */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 py-20 md:py-28 text-center flex flex-col items-center gap-6">
        <p className="text-gold font-bold tracking-[0.3em] uppercase text-sm">Visítanos</p>
        <h2 className="text-4xl md:text-5xl text-charcoal font-playfair font-bold leading-tight">
          Tu mesa te está esperando
        </h2>
        <p className="text-charcoal/80 text-lg font-light">
          {BAR.address} · {SCHEDULE[0].label}: {SCHEDULE[0].hours} · {SCHEDULE[1].label}: {SCHEDULE[1].hours}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <Link to="/menu" className={buttonClasses("dark")}>
            Ver el menú
          </Link>
          <Button color="light" href={whatsappLink("Hola! Me gustaría realizar una reservación")}>
            Reservar
          </Button>
        </div>
      </section>
    </div>
  );
}
