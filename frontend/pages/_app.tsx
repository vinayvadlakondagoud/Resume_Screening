import type { AppProps } from "next/app";
import Head from "next/head";
import ToastContainer from "../components/Toast";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Resume Screener - HR Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-grid">
        <Component {...pageProps} />
      </div>
      <ToastContainer />
    </>
  );
}
