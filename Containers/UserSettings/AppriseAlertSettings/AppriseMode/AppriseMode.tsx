import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AppriseModeDTO, AppriseModeEnum, Optional } from '~/types';
import classes from '../../UserSettings.module.css';

//Components
import Error from '~/Components/UI/Error/Error';
import { useLoader } from '~/contexts/LoaderContext';
import { useFormStatus } from '~/hooks';

type AppriseModeDataForm = {
  appriseMode: string;
  appriseStatelessURL: string;
};

export default function AppriseMode() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppriseModeDataForm>({ mode: 'onChange' });

  const { error, setIsLoading, handleSuccess, handleError, clearError } = useFormStatus();
  const { start, stop } = useLoader();

  const [displayStatelessURL, setDisplayStatelessURL] = useState<boolean>(false);
  const [appriseMode, setAppriseMode] = useState<Optional<AppriseModeEnum>>(
    AppriseModeEnum.STATELESS
  );
  const [appriseStatelessURL, setAppriseStatelessURL] = useState<Optional<string>>();

  //Component did mount
  useEffect(() => {
    //Initial fetch to get Apprise Mode enabled
    const getAppriseMode = async () => {
      try {
        const response = await fetch('/api/v1/notif/apprise/mode', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        });

        const data: AppriseModeDTO = await response.json();
        const { appriseStatelessURL, appriseMode } = data;
        setAppriseMode(appriseMode);

        if (appriseMode == AppriseModeEnum.STATELESS) {
          setAppriseStatelessURL(appriseStatelessURL);
          setDisplayStatelessURL(true);
        }
      } catch (error) {
        console.log('Fetching Apprise Mode failed.');
      }
    };
    getAppriseMode();
  }, []);

  ////Functions
  const modeFormSubmitHandler = async (data: AppriseModeDataForm) => {
    clearError();
    setIsLoading(true);
    start();

    try {
      const response = await fetch('/api/v1/notif/apprise/mode', {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        handleError(result.message);
      } else {
        handleSuccess();
      }
    } catch (error) {
      handleError('The Apprise mode change has failed');
    } finally {
      stop();
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* APPRISE MODE SELECTION */}
      <div className={classes.headerFormAppriseUrls}>
        <div style={{ margin: '0px 10px 0px 0px' }}>Apprise mode</div>
      </div>
      {error && <Error message={error} />}
      <form className={classes.bwForm} onChange={handleSubmit(modeFormSubmitHandler)}>
        <div className='radio-group'>
          <label style={{ marginRight: '50px' }}>
            <div style={{ display: 'flex' }}>
              <input
                {...register('appriseMode')}
                type='radio'
                value='package'
                onClick={() => {
                  setDisplayStatelessURL(false);
                  setAppriseMode(AppriseModeEnum.PACKAGE);
                }}
                checked={appriseMode == 'package' ? true : false}
              />
              <span>Local package</span>
            </div>
          </label>
          <label>
            <div style={{ display: 'flex' }}>
              <input
                {...register('appriseMode')}
                value='stateless'
                type='radio'
                onClick={() => {
                  setDisplayStatelessURL(true);
                  setAppriseMode(AppriseModeEnum.STATELESS);
                }}
                checked={appriseMode == 'stateless' ? true : false}
              />
              <span>Stateless API server</span>
            </div>
          </label>
        </div>
        {displayStatelessURL && (
          <input
            type='text'
            placeholder='http://localhost:8000'
            defaultValue={appriseStatelessURL}
            {...register('appriseStatelessURL', {
              pattern: {
                value: /^(http|https):\/\/.+/g,
                message: 'Invalid URL format.',
              },
            })}
          />
        )}
        {errors.appriseStatelessURL && (
          <small className={classes.errorMessage}>{errors.appriseStatelessURL.message}</small>
        )}
      </form>
    </>
  );
}
