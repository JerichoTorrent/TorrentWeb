import { ArrowRight } from 'lucide-react';

const newsItems = [
  {
    title: 'New Season Launch!',
    date: '2024-03-15',
    excerpt: 'Join us for an exciting new season with amazing new features...',
    link: '#',
  },
  {
    title: 'Weekend Event: Double XP',
    date: '2024-03-14',
    excerpt: 'This weekend, all players will receive double XP for all activities...',
    link: '#',
  },
  {
    title: 'Community Build Contest',
    date: '2024-03-13',
    excerpt: 'Show off your building skills and win amazing prizes...',
    link: '#',
  },
];

export default function NewsSection() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12 title-gradient">
          Latest News
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {newsItems.map((item) => (
            <article
              key={item.title}
              className="glass-card rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300"
            >
              <div className="p-6">
                <time className="text-red-400 text-sm font-medium">{item.date}</time>
                <h3 className="text-xl font-semibold text-gray-200 mt-2 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-400 mb-4">{item.excerpt}</p>
                <a
                  href={item.link}
                  className="inline-flex items-center text-red-400 hover:text-red-300 transition-colors"
                >
                  Read more
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}