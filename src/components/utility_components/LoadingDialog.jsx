export default function LoadingDialog({ toggleLoadingDialogRef }) {
    // use these in components:
    // const toggleLoadingDialogRef = useRef();
    // toggleLoadingDialogRef.current.showModal();
    // toggleLoadingDialogRef.current.close();

    return  (
        <dialog ref={toggleLoadingDialogRef} className="modal">
            <div className="flex items-center justify-center w-full h-full">
                <span className="loading loading-spinner w-32 h-32"></span>
            </div>
        </dialog>
    );
}