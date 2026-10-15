import { Link } from 'react-router-dom';

export default function SignInPromptModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] max-w-sm w-full p-8 text-center relative animate-modalSlide"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-base-content/50 hover:text-base-content bg-base-200 hover:bg-base-300 rounded-full p-2 border-none cursor-pointer transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-base-content mb-2">
          Sign in to continue
        </h2>
        <p className="text-sm text-base-content/60 mb-7">
          Create an account or sign in to add this to your cart and start shopping.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            onClick={onClose}
            className="w-full btn btn-primary py-3 text-sm font-medium"
          >
            Sign In
          </Link>
          <Link
            to="/register-email"
            onClick={onClose}
            className="w-full btn btn-outline py-3 text-sm font-medium"
          >
            Create an Account
          </Link>
        </div>

        <button
          onClick={onClose}
          className="mt-5 text-sm text-base-content/50 hover:text-base-content bg-transparent border-none cursor-pointer underline"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}