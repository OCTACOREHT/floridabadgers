export default function ArticleLoading() {
  return (
    <main className="bg-slate-100">
      <section className="bg-slate-900 px-6 xl:px-10 pt-32 pb-14 border-b border-white/10">
        <div className="max-w-[1100px] mx-auto animate-pulse">
          <div className="h-4 w-24 bg-white/10 rounded mb-6" />
          <div className="h-4 w-16 bg-white/10 rounded mb-3" />
          <div className="h-10 w-3/4 bg-white/20 rounded mb-4" />
          <div className="h-4 w-32 bg-white/10 rounded" />
        </div>
      </section>

      <section className="px-6 xl:px-10 py-10">
        <div className="max-w-[1100px] mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse">
          <div className="aspect-[16/8] w-full bg-slate-200" />
          <div className="p-6 lg:p-8">
            <div className="mx-auto max-w-[820px] space-y-4">
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-5/6 bg-slate-100 rounded" />
              <div className="h-4 w-4/6 bg-slate-100 rounded" />
              <div className="h-40 w-full bg-slate-50 rounded mt-10" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
