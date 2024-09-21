

export default function SubmitButtonComponent({ submitButtonLoading, enabledCriteria, handleSubmit }) {

    return (
        <>
            <div
                className={`btn
                    ${submitButtonLoading || !enabledCriteria  ? 'btn-disabled' : ''}
                `}
                onClick={handleSubmit}
                >{submitButtonLoading ? <span className="loading loading-spinner w-6 h-6 text-accent"></span> : 'Submit'}
            </div>
        </>
    );
}