import React from 'react';

const SkillCategories = () => {
  const skillCategories = [
    { name: 'Programming', icon: '💻', color: 'from-purple-500 to-pink-500' },
    { name: 'Design', icon: '🎨', color: 'from-blue-500 to-purple-500' },
    { name: 'Languages', icon: '🗣️', color: 'from-green-500 to-blue-500' },
    { name: 'Music', icon: '🎵', color: 'from-orange-500 to-red-500' },
    { name: 'Photography', icon: '📸', color: 'from-pink-500 to-purple-500' },
    { name: 'Writing', icon: '✍️', color: 'from-indigo-500 to-purple-500' }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Discover Your Next
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Learning Adventure
            </span>
          </h2>
          <p className="text-xl text-gray-300">Explore hundreds of skills across various categories</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {skillCategories.map((category, index) => (
            <div key={index} className="group cursor-pointer">
              <div className={`bg-gradient-to-br ${category.color} p-6 rounded-2xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl`}>
                <div className="text-center">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <div className="font-semibold text-white">{category.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillCategories;