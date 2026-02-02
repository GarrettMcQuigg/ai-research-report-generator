import Link from 'next/link';
import { Button } from '@/packages/lib/components/button';
import { AUTH_SIGNUP_ROUTE } from '@/packages/lib/routes';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            AI-Powered Research Reports
            <span className="block text-primary mt-2">In Minutes, Not Hours</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Let our team of AI agents research any topic and generate comprehensive reports with verified sources.
            Perfect for students, researchers, and professionals.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href={AUTH_SIGNUP_ROUTE}>
              <Button size="lg">Get Started Free</Button>
            </Link>
            <a href="#features" className="text-sm font-semibold leading-6">
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powered by specialized AI agents working together
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-card p-6 rounded-lg border">
              <div className="text-primary font-semibold mb-2">1. Research Planner</div>
              <h3 className="text-lg font-semibold mb-2">Break Down Topics</h3>
              <p className="text-sm text-muted-foreground">
                Our AI analyzes your topic and creates focused research questions
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="text-primary font-semibold mb-2">2. Researcher</div>
              <h3 className="text-lg font-semibold mb-2">Gather Information</h3>
              <p className="text-sm text-muted-foreground">
                Searches the web and collects relevant information from trusted sources
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="text-primary font-semibold mb-2">3. Critic</div>
              <h3 className="text-lg font-semibold mb-2">Verify Quality</h3>
              <p className="text-sm text-muted-foreground">
                Reviews findings for gaps, biases, and contradictions
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="text-primary font-semibold mb-2">4. Writer</div>
              <h3 className="text-lg font-semibold mb-2">Generate Report</h3>
              <p className="text-sm text-muted-foreground">
                Synthesizes everything into a comprehensive, well-structured report
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to supercharge your research?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start with 3 free reports. No credit card required.
          </p>
          <div className="mt-10">
            <Link href={AUTH_SIGNUP_ROUTE}>
              <Button size="lg">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
