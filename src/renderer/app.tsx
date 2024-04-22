export const App = () => {
  return (
    <div>
      <button
        onClick={() => {
          window.__APP__.whisper.describe();
        }}
      >
        Test ICP
      </button>
    </div>
  );
};
