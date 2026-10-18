import SectionBackground from "../../ui/SectionBackground";
import { HAPPY_HOUR } from "../../../config/bar";

export default function Events() {
  return (
    <section className="relative isolate px-6 md:px-30 py-10 md:py-16">
      <SectionBackground
        src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1257&auto=format&fit=crop"
        brightness={0.23}
      />
      <div className="border-4 md:border-9 border-white w-full min-h-[200px] p-6 flex flex-col justify-center items-center text-center gap-2">
        <h1 className="uppercase text-4xl md:text-6xl text-white font-extrabold">La hora feliz</h1>
        <h2 className="uppercase text-gold font-bold text-base md:text-lg">{HAPPY_HOUR}</h2>
      </div>
    </section>
  );
}
