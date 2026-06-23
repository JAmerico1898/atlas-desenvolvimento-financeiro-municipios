export default function VerifyNotice({ message }: { message?: string }) {
  return (
    <span
      style={{
        fontSize: '0.75rem',
        color: 'var(--warm-gray)',
        borderBottom: '1px dashed var(--warm-gray)',
        cursor: 'help',
      }}
      title={message ?? 'Dado sujeito a verificação de fonte'}
    >
      ⚠ verificar
    </span>
  )
}
