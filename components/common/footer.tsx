export default function Footer() {
  return (
    <footer className='bg-gradient-to-r py-8 mt-12'>
      <div className='container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4'>
        <div className='text-gray-700 font-semibold text-lg'>
          Sommaire &copy; {new Date().getFullYear()}
        </div>
        <div className='flex gap-6 text-gray-600 text-sm'>
          <a
            href='https://github.com/'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-gray-900 transition-colors'
          >
            GitHub
          </a>
          <a href='/privacy' className='hover:text-gray-900 transition-colors'>
            Privacy
          </a>
          <a href='/contact' className='hover:text-gray-900 transition-colors'>
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
