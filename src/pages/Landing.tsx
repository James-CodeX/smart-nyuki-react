import logo from "@/assets/images/logo.svg";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

const features = [
  {
    title: "Apiary Management",
    description: "Create and manage multiple apiaries with detailed location and environmental tracking.",
    icon: "🌍",
  },
  {
    title: "Hive Tracking",
    description: "Maintain detailed records for each beehive, including queen and health status.",
    icon: "🐝",
  },
  {
    title: "Inspections",
    description: "Record comprehensive inspection data, treatments, and attach images.",
    icon: "🔍",
  },
  {
    title: "Real-time Monitoring",
    description: "Live metrics for temperature, humidity, sound, and weight with automated alerts.",
    icon: "📈",
  },
  {
    title: "Production Tracking",
    description: "Track honey and product harvests, analyze efficiency and quality.",
    icon: "🍯",
  },
  {
    title: "Weather Integration",
    description: "Local weather forecasts and data correlation with hive performance.",
    icon: "☀️",
  },
];

const techStack = [
  "React", "TypeScript", "Tailwind CSS", "Supabase", "Framer Motion", "Recharts", "Tremor"
];

export default function Landing() {
  // Refs for smooth scroll
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const techRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-50 via-white to-amber-100">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur shadow-sm border-b border-amber-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollTo(heroRef)}>
            <img src={logo} alt="Smart Nyuki Logo" className="w-10 h-10" />
            <span className="font-bold text-amber-700 text-xl">Smart Nyuki</span>
          </div>
          <div className="hidden md:flex gap-8 text-amber-700 font-semibold text-base">
            <button onClick={() => scrollTo(heroRef)} className="hover:text-amber-900 transition">Home</button>
            <button onClick={() => scrollTo(featuresRef)} className="hover:text-amber-900 transition">Features</button>
            <button onClick={() => scrollTo(techRef)} className="hover:text-amber-900 transition">Technology</button>
            <button onClick={() => scrollTo(aboutRef)} className="hover:text-amber-900 transition">About</button>
            <button onClick={() => scrollTo(contactRef)} className="hover:text-amber-900 transition">Contact</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative flex flex-col items-center justify-center min-h-screen w-full px-4 pt-28 md:pt-32 pb-12 bg-gradient-to-br from-yellow-50 via-amber-100 to-white overflow-hidden">
        {/* Soft background shape */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-amber-100 rounded-full opacity-30 blur-3xl z-0" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-yellow-200 rounded-full opacity-20 blur-2xl z-0" />
        {/* Tagline */}
        <span className="z-10 text-amber-600 font-semibold text-lg md:text-xl mb-2 tracking-wide uppercase bg-amber-50 px-4 py-1 rounded-full shadow-sm">Empowering Modern Beekeepers</span>
        {/* Headline */}
        <h1 className="z-10 text-5xl md:text-7xl font-extrabold text-amber-700 text-center leading-tight drop-shadow-[0_8px_32px_rgba(251,191,36,0.3)] mb-4">
          Smart Nyuki
        </h1>
        {/* Subheadline */}
        <p className="z-10 text-xl md:text-2xl text-gray-700 text-center max-w-2xl mb-8 font-medium">
          The all-in-one platform for tracking, monitoring, and optimizing your apiaries, hives, and honey production.
        </p>
        {/* CTA */}
        <div className="z-10 flex gap-4 mb-10">
          <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white shadow-xl text-lg md:text-xl px-8 py-4 rounded-full font-bold transition-transform hover:scale-105 focus:ring-4 focus:ring-amber-200">
            Get Started
          </Button>
          <button onClick={() => scrollTo(featuresRef)} className="inline-flex items-center text-amber-700 font-semibold hover:underline text-lg md:text-xl transition-transform hover:scale-105">Learn More</button>
        </div>
        {/* Custom SVG Illustration */}
        <div className="z-10 w-full flex justify-center">
          <svg className="w-[320px] md:w-[420px] h-auto" viewBox="0 0 420 320" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="210" cy="260" rx="180" ry="40" fill="#fde68a" opacity="0.4" />
            <rect x="120" y="120" width="180" height="100" rx="30" fill="#fbbf24" stroke="#f59e42" strokeWidth="6" />
            <ellipse cx="210" cy="120" rx="60" ry="40" fill="#fffbe8" stroke="#fbbf24" strokeWidth="4" />
            <circle cx="210" cy="120" r="18" fill="#fbbf24" stroke="#f59e42" strokeWidth="3" />
            <rect x="180" y="200" width="60" height="30" rx="15" fill="#fffbe8" stroke="#fbbf24" strokeWidth="3" />
            {/* Bee */}
            <ellipse cx="210" cy="90" rx="18" ry="10" fill="#fff" stroke="#fbbf24" strokeWidth="3" />
            <ellipse cx="210" cy="90" rx="8" ry="5" fill="#fbbf24" />
            <ellipse cx="202" cy="88" rx="2.5" ry="2" fill="#222" />
            <ellipse cx="218" cy="88" rx="2.5" ry="2" fill="#222" />
            <rect x="206" y="95" width="8" height="4" rx="2" fill="#f59e42" />
            <rect x="208" y="99" width="4" height="8" rx="2" fill="#f59e42" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} id="features" className="w-full bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-700 mb-10">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-amber-50 rounded-xl shadow-md p-8 flex flex-col items-center text-center hover:scale-105 transition-transform">
                <span className="text-5xl mb-4">{feature.icon}</span>
                <h3 className="text-xl font-semibold text-amber-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section ref={techRef} className="w-full py-20 px-4 bg-gradient-to-r from-amber-100 to-yellow-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-amber-700 mb-6">Built with Modern Technologies</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {techStack.map((tech) => (
              <span key={tech} className="bg-white border border-amber-200 rounded-full px-6 py-2 text-lg font-medium text-amber-700 shadow-sm">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section ref={aboutRef} className="w-full py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-amber-700 mb-6">About Smart Nyuki</h2>
          <p className="text-lg text-gray-700 mb-4">
            Smart Nyuki is more than just a beekeeping app—it's a complete ecosystem designed to empower beekeepers of all experience levels. Our mission is to modernize beekeeping through technology, making it easier to monitor hive health, optimize honey production, and ensure the sustainability of bee populations.
          </p>
          <p className="text-lg text-gray-700 mb-4">
            With real-time data, powerful analytics, and intuitive management tools, Smart Nyuki helps you make informed decisions, prevent losses, and maximize your apiary's potential. Whether you manage a single hive or a large operation, Smart Nyuki adapts to your needs.
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center mt-8">
            <div className="flex-1 bg-amber-50 rounded-xl p-6 shadow text-left">
              <h3 className="font-bold text-amber-800 text-xl mb-2">Our Vision</h3>
              <p className="text-gray-700">To be the leading digital platform for sustainable, data-driven beekeeping worldwide.</p>
            </div>
            <div className="flex-1 bg-amber-50 rounded-xl p-6 shadow text-left">
              <h3 className="font-bold text-amber-800 text-xl mb-2">Our Values</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>Innovation in agriculture</li>
                <li>Empowering beekeepers</li>
                <li>Data-driven sustainability</li>
                <li>Community and collaboration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full py-20 px-4">
        <div className="max-w-2xl mx-auto bg-amber-600 rounded-2xl shadow-xl p-10 flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to transform your beekeeping?</h2>
          <p className="text-lg text-amber-100 mb-6">Join Smart Nyuki and take your apiary management to the next level with real-time insights, powerful analytics, and seamless tracking.</p>
          <Button size="lg" className="bg-white text-amber-700 font-bold text-lg px-8 py-3 rounded-full shadow-md hover:bg-amber-100">
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Contact Section */}
      <section ref={contactRef} className="w-full py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-amber-700 mb-6 text-center">Contact Us</h2>
          <form className="bg-amber-50 rounded-xl shadow-md p-8 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input type="text" placeholder="Your Name" className="flex-1 px-4 py-3 rounded border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400" required />
              <input type="email" placeholder="Your Email" className="flex-1 px-4 py-3 rounded border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400" required />
            </div>
            <textarea placeholder="Your Message" rows={4} className="px-4 py-3 rounded border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400" required />
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-3 rounded-full self-end">Send Message</Button>
          </form>
          <div className="text-center mt-6 text-gray-700">
            <p>Email: <a href="mailto:james.nyakairu@students.jkuat.ac.ke" className="underline text-amber-700">james.nyakairu@students.jkuat.ac.ke</a></p>
            <p className="mt-2">&copy; {new Date().getFullYear()} James-CodeX. All rights reserved.</p>
          </div>
        </div>
      </section>
    </div>
  );
} 