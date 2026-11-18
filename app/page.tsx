import AiDemo from "@/components/AiDemo";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-3 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Product name — TBD on the day
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted">
          One-line pitch goes here. The boilerplate is live; swap this copy the
          moment the problem lands.
        </p>
      </section>
      <AiDemo />
    </div>
  );
}
