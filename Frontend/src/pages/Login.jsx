import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
        await login(email, password)
        navigate('/dashboard')
        } catch (err) {
        setError('Email ou mot de passe incorrect.')
        } finally {
        setLoading(false)
        }
    }

    return (
        <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="card shadow-sm" style={{ width: '380px' }}>
            <div className="card-body p-4">
            <h4 className="text-center mb-4">AuditFlow</h4>

            {error && <div className="alert alert-danger py-2">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                </div>

                <div className="mb-3">
                <label className="form-label">Mot de passe</label>
                <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
                </button>
            </form>
            </div>
        </div>
        </div>
    )
}

export default Login