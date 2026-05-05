import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900">PhD Seminar Platform</h1>
        <p className="mt-4 max-w-2xl text-gray-600">
          Manage seminar scheduling, progress reports, and faculty feedback in one place.
        </p>
        <div className="mt-8 flex gap-3">
          <Link className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700" to="/login">
            Login
          </Link>
          <Link
            className="rounded border border-blue-600 px-5 py-2 text-blue-600 hover:bg-blue-50"
            to="/register"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home
