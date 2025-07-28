import Head from 'next/head';
import Sidebar from '@/app/ui/sidebar';
import Header from '@/app/ui/header';
import Footer from '@/app/ui/footer';
import { Suspense } from 'react';
import Spinner from '@/app/ui/spinner';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <title>Remote Work Form Management Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="flex flex-col h-screen overflow-y-hidden bg-[#3e5172]">
        {/* Slim Header - 48px height */}
        <header className="sticky top-0 z-10 h-12 bg-white shadow-sm">
          <Header />
        </header>

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {/* <Sidebar organisationID={1} /> */}
          <Sidebar />

          {/* Main content with left margin matching sidebar width */}
          <div className="flex-1 flex flex-col ml-16 md:ml-52 transition-all duration-300">
            <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
              <div className="max-w-7xl mx-auto">
                <Suspense fallback={<Spinner />}>
                  {children}
                </Suspense>
              </div>
            </main>


          </div>
        </div>

        {/* Slim Footer - 40px height */}
        <footer className="sticky bottom-0 bg-[#3e5172] text-white h-10 flex items-center justify-center">
          <Footer />
        </footer>

      </div>
    </>
  );
}