import React from 'react';
import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import PageContainer from '@/components/PageContainer';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const UnauthorizedPage = () => {
  const router = useRouter();

  return (
    <PageContainer>
      <Flex
        h={'100%'}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        px={[5, 10]}
      >
        <MyIcon name="closeSolid" w={'48px'} h={'48px'} color="myGray.500" />
        <Text fontSize="xl" fontWeight="bold" mt={6} color={'myGray.900'}>
          无权访问
        </Text>
        <Text fontSize="md" mt={2} color={'myGray.500'} textAlign={'center'}>
          授权令牌无效或已过期，请联系管理员获取有效的访问链接
        </Text>
      </Flex>
    </PageContainer>
  );
};

// 设置页面不使用导航栏布局
UnauthorizedPage.setLayout = (page: JSX.Element) => page;

export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common']))
    }
  };
};

export default UnauthorizedPage; 