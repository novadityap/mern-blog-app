import { Button } from '@/components/shadcn-ui/button';
import { Input } from '@/components/shadcn-ui/input';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/shadcn-ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/shadcn-ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/shadcn-ui/card';
import { useSigninMutation } from '@/services/authApi';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { TbLoader, TbExclamationCircle } from 'react-icons/tb';
import useFormHandler from '@/hooks/useFormHandler';

const Signin = () => {
  const navigate = useNavigate();
  const { token } = useSelector(state => state.auth);
  const { form, handleSubmit, isLoading, error, isSuccess, message } =
    useFormHandler({
      formType: 'signin',
      mutation: useSigninMutation,
      defaultValues: { 
        email: '', 
        password: '' 
      },
    });

  useEffect(() => {
    if (token || isSuccess) navigate('/');
  }, [token, isSuccess, navigate]);

  if (!token) {
    return (
      <Card className="w-full sm:w-[450px]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-600">
            Sign In
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error?.code === 401 && (
            <Alert variant="destructive">
              <TbExclamationCircle className="size-5 text-red-500" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <TbLoader className="animate-spin mr-2 size-5" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <div className="flex items-center justify-betweens gap-2">
            <p className="text-gray-500 text-sm">
              Don&apos;t have an account?
            </p>
            <Link
              to="/signup"
              className="text-sm text-gray-500 hover:underline hover:text-blue-600"
            >
              Sign Up
            </Link>
          </div>
          <Link
            to="/request-reset-password"
            className="text-sm text-gray-500 hover:underline hover:text-blue-600"
          >
            Forgot Password?
          </Link>
        </CardFooter>
      </Card>
    );
  }
};

export default Signin;
