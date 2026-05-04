import type { User } from '../models/models';
import ThemedLogo from '../components/ThemedLogo';
import ThemeToggle from '../components/ThemeToggle';

type HomePageProps = {
  user: User;
};

const HomePage = ({ user }: HomePageProps) => {
  return (
    <main className="home-page">
      <header className="home-header">
        <div className="home-title">
          <ThemedLogo />
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>Welcome, {user.fullName}</h1>
          </div>
        </div>
        <ThemeToggle />
      </header>
    </main>
  );
};

export default HomePage;
