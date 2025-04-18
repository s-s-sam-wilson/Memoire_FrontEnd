import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"; 

import { Pacifico } from 'next/font/google';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Memoire",
  description: "A slambook",
};


const pacifico = Pacifico({ weight: "400", subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
      <style>
          {`@import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');`}
        </style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
