import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';


const CapMeasurement = () => {
    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-100 py-30">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">Cap Measurement Guide</h1>

                    {/* Measurement Guide Content */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                        <h2 className="text-2xl font-bold mb-4">How to Measure Your Head</h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">1</span>
                                <p>Use a soft measuring tape (like for sewing)</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">2</span>
                                <p>Wrap it around your head about 1 inch above your ears</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">3</span>
                                <p>Keep the tape level and snug (not tight)</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">4</span>
                                <p>Note the measurement in inches or centimeters</p>
                            </div>
                        </div>
                    </div>

                    {/* Size Chart */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold mb-4">Size Conversion Chart</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2">Cap Size</th>
                                        <th className="text-left py-2">Inches</th>
                                        <th className="text-left py-2">Centimeters</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b"><td className="py-2">6 7/8</td><td>21.5-21.8"</td><td>54.6-55.3 cm</td></tr>
                                    <tr className="border-b"><td className="py-2">7</td><td>21.9-22.2"</td><td>55.6-56.3 cm</td></tr>
                                    <tr className="border-b"><td className="py-2">7 1/8</td><td>22.3-22.6"</td><td>56.6-57.3 cm</td></tr>
                                    <tr className="border-b"><td className="py-2">7 1/4</td><td>22.7-23.0"</td><td>57.6-58.3 cm</td></tr>
                                    <tr className="border-b"><td className="py-2">7 3/8</td><td>23.1-23.4"</td><td>58.6-59.3 cm</td></tr>
                                    <tr className="border-b"><td className="py-2">7 1/2</td><td>23.5-23.8"</td><td>59.6-60.3 cm</td></tr>
                                    <tr className="border-b"><td className="py-2">7 5/8</td><td>23.9-24.2"</td><td>60.6-61.3 cm</td></tr>
                                    <tr><td className="py-2">7 3/4</td><td>24.3-24.6"</td><td>61.6-62.3 cm</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
};

export default CapMeasurement;