export function LoadingBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="loading-block" aria-label="Loading">
      {Array.from({ length: lines }, (_, index) => <span key={index} className="skeleton" />)}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <span className="loader-orbit" />
      <p>Loading Plug-In</p>
    </div>
  )
}
