import { Link } from 'react-router-dom';

export default function SignInPromptModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[90] px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF8F4] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] max-w-sm w-full p-8 text-center relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6B6558] hover:text-[#14110D] bg-transparent border-none cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-12 h-12 rounded-full bg-[#F0ECE1] flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6 text-[#A9824C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <h2 className="font-heading text-xl uppercase tracking-wide text-[#14110D] mb-2">
          Sign in to continue
        </h2>
        <p className="font-body text-sm text-[#6B6558] mb-7">
          Create an account or sign in to add this to your cart and start shopping.
        </p>

        <div className="flex flex-col gap-2.5">
          <Link
            to="/login"
            className="w-full bg-[#14110D] text-[#FAF8F4] font-body text-sm font-medium py-3 rounded-full hover:bg-[#2A241C] transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register-email"
            className="w-full border border-[#D8D2C4] text-[#14110D] font-body text-sm font-medium py-3 rounded-full hover:bg-[#F0ECE1] transition-colors"
          >
            Create an account
          </Link>
        </div>

        <button
          onClick={onClose}
          className="mt-5 font-body text-xs text-[#6B6558] hover:text-[#14110D] bg-transparent border-none cursor-pointer underline"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}