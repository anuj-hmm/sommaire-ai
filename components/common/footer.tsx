import Link from 'next/link';
export default function Footer() {
  return (
    <footer className='relative bg-gradient-to-r from-rose-50 to-white py-16 border-t border-rose-100'>
      <div className='container mx-auto px-4 flex flex-col items-center justify-center gap-10'>
        <div className='flex flex-col md:flex-row items-center justify-center gap-8 text-gray-600'>
          <Link
            href='https://github.com/'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-rose-600 transition-colors font-medium text-lg'
          >
            GitHub
          </Link>
          <Link
            href='/privacy'
            className='hover:text-rose-600 transition-colors font-medium text-lg'
          >
            Privacy
          </Link>
          <Link
            href='/contact'
            className='hover:text-rose-600 transition-colors font-medium text-lg'
          >
            Contact
          </Link>
        </div>

        <div className='text-gray-700 font-medium text-lg'>
          &copy; {new Date().getFullYear()} Sommaire. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
