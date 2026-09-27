const ApiState = ({ loading, error, empty = false }) => {
  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <p className="text-lg text-zinc-400">در حال دریافت اطلاعات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center px-4">
        <p className="text-center text-lg text-red-400">{error}</p>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center px-4">
        <p className="text-center text-lg text-zinc-500">محصولی پیدا نشد.</p>
      </div>
    );
  }

  return null;
};

export default ApiState;
