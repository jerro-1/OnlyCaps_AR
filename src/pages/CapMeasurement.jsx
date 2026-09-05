import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BgImg from '../components/BgImg'; // Added BgImg import

const STEPS = [
  { n: '01', title: 'Get a soft tape', detail: 'A fabric tailor\'s tape works best — a stiff metal one won\'t follow the curve of your head accurately.' },
  { n: '02', title: 'Find your line', detail: 'Wrap it around your head about an inch above your ears, running just above your eyebrows at the front.' },
  { n: '03', title: 'Keep it level', detail: 'The tape should sit flat and level all the way around — snug against your head, but not compressing it.' },
  { n: '04', title: 'Read the number', detail: 'Note the measurement in inches or centimeters, then match it against the chart on the right.' },
];

const SIZES = [
  { size: '6 7/8', inches: '21.5–21.8"', cm: '54.6–55.3 cm' },
  { size: '7', inches: '21.9–22.2"', cm: '55.6–56.3 cm' },
  { size: '7 1/8', inches: '22.3–22.6"', cm: '56.6–57.3 cm' },
  { size: '7 1/4', inches: '22.7–23.0"', cm: '57.6–58.3 cm' },
  { size: '7 3/8', inches: '23.1–23.4"', cm: '58.6–59.3 cm' },
  { size: '7 1/2', inches: '23.5–23.8"', cm: '59.6–60.3 cm' },
  { size: '7 5/8', inches: '23.9–24.2"', cm: '60.6–61.3 cm' },
  { size: '7 3/4', inches: '24.3–24.6"', cm: '61.6–62.3 cm' },
];

const CapMeasurement = () => {
  return (
    <>
      <BgImg>
        <Header />
        <div className="min-h-screen pt-32 pb-24">
          <div className="container mx-auto px-6 max-w-5xl">

            {/* Hero */}
            <div className="mb-14 max-w-xl">
              <p className="text-[#A9824C] text-xs tracking-[0.2em] font-body mb-3">Fit reference</p>
              <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-wide text-[#FAF8F4] leading-tight mb-4">
                Find your size
              </h1>
              <p className="font-body text-[#B8B2A3] text-base leading-relaxed">
                Every OnlyCaps fitted style runs true to standard hat sizing. Measure once, and you'll know your
                size across the whole collection.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">

              {/* Steps */}
              <div className="bg-[#FAF8F4] rounded-2xl p-8 md:p-10">
                <h2 className="font-heading text-xl uppercase tracking-wide text-[#14110D] mb-8">
                  How to measure
                </h2>
                <div className="space-y-7">
                  {STEPS.map((step, i) => (
                    <div key={step.n} className="flex gap-5">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <span className="font-heading text-sm text-[#A9824C] mt-0.5">{step.n}</span>
                        {i < STEPS.length - 1 && (
                          <span className="w-px flex-1 bg-[#E4DFD3] mt-2" />
                        )}
                      </div>
                      <div className="pb-1">
                        <p className="font-body font-semibold text-[#14110D] text-sm mb-1">{step.title}</p>
                        <p className="font-body text-[#6B6558] text-sm leading-relaxed">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Size chart */}
              <div className="bg-[#FAF8F4] rounded-2xl p-8 md:p-10">
                <h2 className="font-heading text-xl uppercase tracking-wide text-[#14110D] mb-2">
                  Size chart
                </h2>
                <p className="font-body text-[#6B6558] text-sm mb-6">
                  Match your measurement to the closest cap size below.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full font-body text-sm">
                    <thead>
                      <tr className="border-b border-[#E4DFD3]">
                        <th className="text-left py-3 text-[#6B6558] font-medium">Size</th>
                        <th className="text-left py-3 text-[#6B6558] font-medium">Inches</th>
                        <th className="text-left py-3 text-[#6B6558] font-medium">Centimeters</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIZES.map(row => (
                        <tr key={row.size} className="border-b border-[#E4DFD3] last:border-0">
                          <td className="py-3 font-semibold text-[#14110D]">{row.size}</td>
                          <td className="py-3 text-[#4A453B]">{row.inches}</td>
                          <td className="py-3 text-[#4A453B]">{row.cm}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 pt-6 border-t border-[#E4DFD3]">
                  <p className="font-body text-xs text-[#6B6558] leading-relaxed">
                    Between two sizes? Size up — fitted caps break in and relax slightly with wear.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </BgImg>
      <Footer />
    </>
  );
};

export default CapMeasurement;