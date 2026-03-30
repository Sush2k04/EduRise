import React from 'react';
import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import SkillCategories from '../components/SkillCategories';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import Pricing from '../components/Pricing';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <>
      <Navigation />
      <Hero />
      <SkillCategories />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </>
  );
};

export default Home;