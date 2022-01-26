import type { LinksFunction, MetaFunction } from "remix";
import globalStyles from "../styles/global.css";
import localStyles from "../styles/index.css";

export const meta: MetaFunction = () => {
  return {
    title: `Play Family`,
  };
};

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: globalStyles },
    { rel: "stylesheet", href: localStyles },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap",
    },
  ];
};

export default function Index() {
  return (
    <div className="indexContainer">
      <div className="imageContainer"></div>
      <div className="buttonWrapper">
        <a className="button joinLink indexBtn" href="/join">
          Join Game
        </a>
      </div>
      <form action="/create" method="post">
        <button className="button indexBtn invertBtn" type="submit">
          Create Game
        </button>
      </form>
    </div>
  );
}
