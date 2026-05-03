import type { User } from '../models/models';

type HomePageProps = {
  user: User;
};

const HomePage = ({ user }: HomePageProps) => {
  return (
    <main className="home-page">
      <header className="home-header">
        <img src="/logo/TopGearLogo.png" alt="TopGear" />
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Welcome, {user.fullName}</h1>
        </div>
      </header>
    </main>
  );
};

export default HomePage;
