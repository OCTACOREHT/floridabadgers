export default function NewsLoading() {
  return (
    <main className="">
      <section className="bg-slate-900 px-6 xl:px-10 pt-32 pb-20 border-b border-white/10">
        <div className="max-w-[1320px] mx-auto animate-pulse">
          <div className="h-4 w-20 bg-white/10 rounded mb-3" />
          <div className="h-12 w-1/2 bg-white/20 rounded mb-4" />
          <div className="h-4 w-1/3 bg-white/10 rounded" />
        </div>
      </section>

      <section className="bg-slate-100 px-6 xl:px-10 py-10">
        <div className="max-w-[1320px] mx-auto grid xl:grid-cols-2 gap-6 animate-pulse">
          <div className="grid gap-6">
            <div className="h-64 bg-white border border-slate-200" />
            <div className="h-64 bg-white border border-slate-200" />
          </div>
          <div className="h-full bg-white border border-slate-200" />
        </div>
      </section>

      <section className="bg-white px-6 xl:px-10 py-16 border-t border-slate-200">
        <div className="max-w-[1320px] mx-auto animate-pulse">
          <div className="h-8 w-48 bg-slate-200 rounded mb-8" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-50 border border-slate-200" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
