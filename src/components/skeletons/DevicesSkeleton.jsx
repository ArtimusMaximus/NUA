export default function DeviceSkeleton({ devices, loadingMacData })
{
    const skeletons = () => {
        let arr=[];
        let length = 5;
        while(length > 0) {
            arr.push('LOADING...')
            length -= 1;
        }
        return arr;
    }
    const skelArray = skeletons();

    return (
        <>
            {
                skelArray.map((skeleton) => {
                    return (
                        <>
                            <div className={`${loadingMacData ? 'skeleton w-full h-[60px]' : ''} grid-flow-row flex items-center justify-center mx-auto text-2xl gap-2 my-2 py-2`}>      {!devices && !loadingMacData && 'There is not data to display...'}
                                <div className="flex flex-row items-center justify-center italic">
                                    <span className="loading loading-spinner w-6 h-6 mr-2"></span>{skeleton}
                                </div>
                            </div>
                        </>
                    )
                })
            }
        </>
    );
}