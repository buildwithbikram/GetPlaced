import { Link } from 'react-router-dom';

function Home() {
  return (
    <main>

      {/* Hero Section */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-24">

          <div className="mx-auto max-w-3xl text-center">

            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-600">
              College Placement Platform
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Your journey from
              <span className="text-blue-600"> campus to career.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              GetPlaced helps students discover placement opportunities,
              check eligibility, manage applications and stay updated
              throughout their placement journey.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">

              <Link
                to="/register"
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Get Started
              </Link>

              <Link
                to="/jobs"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Explore Opportunities
              </Link>

            </div>

          </div>

        </div>
      </section>


      {/* Features */}
      <section className="bg-white py-20">

        <div className="mx-auto max-w-7xl px-6">

          <div className="mx-auto max-w-2xl text-center">

            <h2 className="text-3xl font-bold text-slate-900">
              Everything you need for placements
            </h2>

            <p className="mt-4 text-slate-600">
              Manage your complete placement journey from one platform.
            </p>

          </div>


          <div className="mt-12 grid gap-6 md:grid-cols-3">

            <FeatureCard
              title="Build Your Profile"
              description="Maintain your academic information, skills, projects, certifications and resume in one place."
            />

            <FeatureCard
              title="Find Opportunities"
              description="Discover companies and job opportunities based on your academic and technical profile."
            />

            <FeatureCard
              title="Track Applications"
              description="Apply to eligible opportunities and track your application status throughout the recruitment process."
            />

          </div>

        </div>

      </section>


      {/* CTA */}
      <section className="bg-blue-600 py-20">

        <div className="mx-auto max-w-4xl px-6 text-center">

          <h2 className="text-3xl font-bold text-white">
            Ready to start your placement journey?
          </h2>

          <p className="mt-4 text-blue-100">
            Create your profile and discover opportunities that match your skills.
          </p>

          <Link
            to="/register"
            className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50"
          >
            Create Your Profile
          </Link>

        </div>

      </section>

    </main>
  );
}


function FeatureCard({ title, description }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

      <h3 className="text-xl font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-slate-600">
        {description}
      </p>

    </div>
  );
}


export default Home;