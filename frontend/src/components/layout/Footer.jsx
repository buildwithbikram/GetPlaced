function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>
            <h2 className="text-lg font-bold text-blue-600">
              GetPlaced
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your journey from campus to career.
            </p>
          </div>

          <p className="text-sm text-slate-500">
            © 2026 GetPlaced. All rights reserved.
          </p>

        </div>

      </div>
    </footer>
  );
}

export default Footer;