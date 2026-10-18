type Props = {
  src: string;
  brightness?: number;
  grain?: number;
  grayscale?: boolean;
};

/** Fondo con imagen + textura de grano. La sección padre debe ser `relative isolate`. */
export default function SectionBackground({
  src,
  brightness = 0.3,
  grain = 0.5,
  grayscale = true,
}: Props) {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${src}')`,
          filter: `brightness(${brightness})${grayscale ? " grayscale(1)" : ""}`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-grain pointer-events-none mix-blend-overlay"
        style={{ opacity: grain }}
      />
    </>
  );
}
