import { GameLoaderData } from "../$code";

export default function InProgress(props: { data: GameLoaderData }) {
  const { game, players, me } = props.data;

  return (
    <div>
      {me.isHost && (
        <div className="buttonContainer">
          <form method="post">
            <button
              className="button"
              type="submit"
              name="_action"
              value="back_to_names"
            >
              <span style={{ transform: "rotate(180deg)", marginBottom: -4 }}>
                &#x279C;
              </span>
              &nbsp;Back to Names
            </button>
          </form>
          <form method="post">
            <button
              className="button"
              type="submit"
              name="_action"
              value="finish_game"
            >
              Finish Game&nbsp;<span style={{ fontWeight: 500 }}>✓</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
