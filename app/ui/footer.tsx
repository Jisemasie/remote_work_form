export default function Footer() {
  const d = new Date()
  const year = d.getFullYear()
  return (
    <footer className="bg-[#3e5172] text-white py-3 px-6 shadow-inner w-full  border-t-2">
      <div className="max-w-7xl mx-auto text-center">
        <span className="text-sm font-medium">
          © FINCA RD CONGO SARL {year} — Formulaire de travail à distance v1.0.0
        </span>
      </div>
    </footer>
  );
}